import logging
from types import SimpleNamespace
from fastapi import APIRouter, Request, Response
from app.services.db import (
    get_farmer_by_phone,
    create_farmer,
    update_farmer_onboarding,
    get_plot_for_farmer,
    create_plot,
    create_escalation,
)
from app.services.soil import soil_service
from app.services.weather import weather_service
from app.services.advisor import advisor_service
from app.services.whatsapp import send_whatsapp_message
from app.services.vision import diagnose_photo

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["WhatsApp Webhook"],
)


def format_recommendation_message(rec: dict, language: str) -> str:
    """
    Format the JSON recommendation dictionary into a friendly WhatsApp message.
    """
    if not rec:
        no_advice_messages = {
            "te": "క్షమించండి, ప్రస్తుతం పంట సలహా తయారు చేయలేకపోతున్నాము. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.",
            "hi": "क्षमा करें, इस समय फसल सलाह तैयार नहीं हो पा रही। कृपया बाद में पुनः प्रयास करें।",
            "en": "Sorry, I could not generate any agricultural advice at this moment. Please try again later.",
        }
        lang_key = (language.lower() if language else "te")
        if lang_key not in no_advice_messages:
            lang_key = "te"
        return no_advice_messages.get(lang_key, no_advice_messages["en"])
        
    if "error" in rec:
        error_messages = {
            "te": "పంట సలహా సేవలో సమస్య ఏర్పడింది. దయచేసి కొద్దిసేపట్లో మళ్ళీ ప్రయత్నించండి.",
            "hi": "फसल सलाह सेवा में समस्या आई। कृपया कुछ देर बाद पुनः प्रयास करें।",
            "en": "There was an issue with the crop advisory service. Please try again shortly.",
        }
        lang_key = (language.lower() if language else "te")
        if lang_key not in error_messages:
            lang_key = "te"
        return error_messages.get(lang_key, error_messages["en"])

    # Default to "te" (Telugu) if not supported
    lang = language.lower() if language else "te"
    if lang not in {"te", "hi", "en"}:
        lang = "te"

    if lang == "te":
        msg = "🌾 *మీ కిసాన్ అలర్ట్ పంట సలహాదారు* 🌾\n\n"
        msg += f"📢 *సాధారణ సలహా:* {rec.get('general_advisory', 'సమాచారం అందుబాటులో లేదు.')}\n\n"
        
        recs = rec.get("recommendations", [])
        if recs:
            msg += "🌱 *సిఫార్సు చేయబడిన పంటలు:*\n"
            for i, crop in enumerate(recs, 1):
                msg += f"\n*{i}. {crop.get('crop', 'పంట పేరు')}*\n"
                msg += f"   • *కారణం:* {crop.get('reason', 'N/A')}\n"
                msg += f"   • *విత్తే సమయం:* {crop.get('sowing_window', 'N/A')}\n"
                msg += f"   • *నీటి అవసరం:* {crop.get('water_need', 'N/A')}\n"
                msg += f"   • *అంచనా దిగుబడి:* {crop.get('expected_yield', 'N/A')}\n"
                warnings = crop.get("warnings", [])
                if warnings:
                    msg += f"   • *హెచ్చరికలు:* {', '.join(warnings)}\n"
        
        msg += f"\n💧 *నీటిపారుదల సలహా:* {rec.get('irrigation_advice', 'N/A')}\n"
        msg += f"🧪 *ఎరువుల సలహా:* {rec.get('fertiliser_advice', 'N/A')}\n"
        
        quality = rec.get("data_quality_notes", [])
        if quality:
            msg += f"\n⚠️ *గమనిక:* {'; '.join(quality)}\n"

    elif lang == "hi":
        msg = "🌾 *आपका किसान अलर्ट फसल सलाहकार* 🌾\n\n"
        msg += f"📢 *सामान्य सलाह:* {rec.get('general_advisory', 'जानकारी उपलब्ध नहीं है।')}\n\n"
        
        recs = rec.get("recommendations", [])
        if recs:
            msg += "🌱 *अनुशंसित फसलें:*\n"
            for i, crop in enumerate(recs, 1):
                msg += f"\n*{i}. {crop.get('crop', 'फसल का नाम')}*\n"
                msg += f"   • *कारण:* {crop.get('reason', 'N/A')}\n"
                msg += f"   • *बुवाई का समय:* {crop.get('sowing_window', 'N/A')}\n"
                msg += f"   • *पानी की आवश्यकता:* {crop.get('water_need', 'N/A')}\n"
                msg += f"   • *संभावित उपज:* {crop.get('expected_yield', 'N/A')}\n"
                warnings = crop.get("warnings", [])
                if warnings:
                    msg += f"   • *चेतावनियाँ:* {', '.join(warnings)}\n"
        
        msg += f"\n💧 *सिंचाई सलाह:* {rec.get('irrigation_advice', 'N/A')}\n"
        msg += f"🧪 *उर्वरक सलाह:* {rec.get('fertiliser_advice', 'N/A')}\n"
        
        quality = rec.get("data_quality_notes", [])
        if quality:
            msg += f"\n⚠️ *नोट:* {'; '.join(quality)}\n"

    else: # English
        msg = "🌾 *Your Kisan Alert Crop Advisory* 🌾\n\n"
        msg += f"📢 *General Advisory:* {rec.get('general_advisory', 'No advice generated.')}\n\n"
        
        recs = rec.get("recommendations", [])
        if recs:
            msg += "🌱 *Recommended Crops:*\n"
            for i, crop in enumerate(recs, 1):
                msg += f"\n*{i}. {crop.get('crop', 'Crop Name')}*\n"
                msg += f"   • *Reason:* {crop.get('reason', 'N/A')}\n"
                msg += f"   • *Sowing Window:* {crop.get('sowing_window', 'N/A')}\n"
                msg += f"   • *Water Need:* {crop.get('water_need', 'N/A')}\n"
                msg += f"   • *Expected Yield:* {crop.get('expected_yield', 'N/A')}\n"
                warnings = crop.get("warnings", [])
                if warnings:
                    msg += f"   • *Warnings:* {', '.join(warnings)}\n"
        
        msg += f"\n💧 *Irrigation Advice:* {rec.get('irrigation_advice', 'N/A')}\n"
        msg += f"🧪 *Fertilizer Advice:* {rec.get('fertiliser_advice', 'N/A')}\n"
        
        quality = rec.get("data_quality_notes", [])
        if quality:
            msg += f"\n⚠️ *Data Notes:* {'; '.join(quality)}\n"
            
    return msg


async def generate_and_send_advisory(farmer_id: str, village_id: str, language: str, to_phone: str):
    """
    Retrieve plot, soil, and weather, trigger Gemini advisor, format, and send response message.
    """
    try:
        # 1. Look up plot
        plots = get_plot_for_farmer(farmer_id)
        if not plots:
            logger.info(f"No plot record found for farmer {farmer_id}. Creating default plot...")
            # Set default soil ref to point to village default fallback
            soil_ref = f"village_default:{village_id}"
            plot = create_plot(
                farmer_id=farmer_id,
                lat=17.3850,       # default latitude
                lng=78.4867,       # default longitude
                crop_current="None",
                soil_data_ref=soil_ref
            )
            if not plot:
                logger.error("Failed to generate default plot.")
                plot_error_messages = {
                    "te": "ఫారం ప్లాట్ నమోదు చేయడంలో సమస్య. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.",
                    "hi": "खेत का प्लॉट पंजीकृत करने में समस्या। कृपया बाद में पुनः प्रयास करें।",
                    "en": "Unable to register a farm plot. Please try again later.",
                }
                _lang = (language.lower() if language else "te")
                send_whatsapp_message(to_phone=to_phone, body=plot_error_messages.get(_lang, plot_error_messages["en"]))
                return
        else:
            plot = plots[0]

        # 2. Look up soil data
        plot_obj = SimpleNamespace(
            soil_data_ref=plot.get("soil_data_ref"),
            village_id=village_id
        )
        soil_data = soil_service.get_soil_for_plot(plot_obj)
        logger.info(f"Resolved soil nutrients: {soil_data}")

        # 3. Look up weather snapshot
        field_snapshot = await weather_service.get_field_snapshot()
        logger.info(f"Resolved weather field snapshot: {field_snapshot}")

        # 4. Generate crop recommendation from Gemini
        recommendation = await advisor_service.get_crop_recommendation(
            field_snapshot=field_snapshot,
            soil_nutrients=soil_data,
            season="kharif",  # default season
            language=language
        )
        logger.info(f"Advisor recommendation response: {recommendation}")

        # 5. Format and dispatch
        advisory_msg = format_recommendation_message(recommendation, language)
        send_whatsapp_message(to_phone=to_phone, body=advisory_msg)

    except Exception as e:
        logger.error(f"Failed to generate and send advisory: {e}", exc_info=True)
        advisory_error_messages = {
            "te": "మీ పంట సలహా తయారు చేయడంలో సమస్య వచ్చింది. దయచేసి కొద్దిసేపట్లో మళ్ళీ ప్రయత్నించండి.",
            "hi": "आपकी फसल सलाह तैयार करने में समस्या आई। कृपया कुछ देर बाद पुनः प्रयास करें।",
            "en": "We encountered an issue generating your crop advisory. Please try again shortly.",
        }
        _lang = (language.lower() if language else "te")
        send_whatsapp_message(to_phone=to_phone, body=advisory_error_messages.get(_lang, advisory_error_messages["en"]))


@router.post("/webhook/whatsapp")
@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    """
    Webhook endpoint to receive incoming WhatsApp messages from Twilio.
    Supports both /webhook/whatsapp and /whatsapp/webhook paths.
    """
    logger.info("Received inbound WhatsApp request from Twilio.")
    try:
        # Read form encoded body parameters
        form_data = await request.form()
        from_phone_raw = form_data.get("From", "")       # e.g., "whatsapp:+919876543210"
        body_text = form_data.get("Body", "").strip()    # User's text message
        num_media = int(form_data.get("NumMedia", 0))     # Number of media files attached
        media_url_0 = form_data.get("MediaUrl0", "")      # URL of first media item
        profile_name = form_data.get("ProfileName", "Farmer")

        logger.info(f"Form data parsed: From={from_phone_raw}, Body='{body_text}', NumMedia={num_media}, ProfileName='{profile_name}'")

        # Exclude 'whatsapp:' prefix and '+' to get the clean phone number
        phone_number = from_phone_raw.replace("whatsapp:", "").replace("+", "")
        if not phone_number:
            logger.error("No phone number found in Twilio request From parameter.")
            return Response(content="<Response></Response>", media_type="application/xml")

        # Initialize farmer to None — it will be looked up lazily below.
        # This prevents UnboundLocalError in Python 3.11+ where any variable
        # assigned later in the function scope becomes "local" throughout.
        farmer = None

        # ── Media branch: crop photo → Gemini Vision → pending escalation ─────
        if num_media > 0:
            logger.info("Image attachment detected from %s. Starting disease diagnosis flow.", phone_number)

            # We need a farmer record to attach the escalation to a plot
            if not farmer:
                farmer = get_farmer_by_phone(phone_number)

            if not farmer:
                logger.warning("Received image from unknown farmer %s — cannot create escalation.", phone_number)
                register_first_messages = {
                    "te": "దయచేసి ముందు టెక్స్ట్ మెసేజ్ పంపి రిజిస్టర్ అవ్వండి, ఆ తర్వాత మీ పంట ఫోటో పంపండి.",
                    "hi": "कृपया पहले एक टेक्स्ट मैसेज भेजकर रजिस्टर करें, फिर अपनी फसल की फोटो भेजें।",
                    "en": "Please send a text message first to register, then send your crop photo.",
                }
                send_whatsapp_message(
                    to_phone=from_phone_raw,
                    body=register_first_messages.get("te", register_first_messages["en"]),
                )
                return Response(content="<Response></Response>", media_type="application/xml")

            farmer_language = farmer.get("language", "te")
            farmer_village  = farmer.get("village_id", "")

            # 1. Get farmer's plot
            plots = get_plot_for_farmer(farmer["id"])
            plot  = plots[0] if plots else None

            if not plot:
                logger.info("No plot found for farmer %s — creating default plot before escalation.", farmer["id"])
                plot = create_plot(
                    farmer_id    = farmer["id"],
                    lat          = 17.3850,
                    lng          = 78.4867,
                    crop_current = "Unknown",
                    soil_data_ref = f"village_default:{farmer_village}",
                )

            plot_id = plot["id"] if plot else "unknown"

            # 2. Run Gemini Vision diagnosis (runs in background before ack)
            logger.info("Running Gemini Vision diagnosis on media from %s...", media_url_0)
            ai_diagnosis = await diagnose_photo(image_url=media_url_0, language=farmer_language)
            logger.info("Diagnosis complete: %s", ai_diagnosis[:80])

            # 3. Create a pending escalation row — AI diagnosis is NOT sent to farmer yet
            escalation = create_escalation(
                plot_id      = plot_id,
                photo_url    = media_url_0,
                ai_diagnosis = ai_diagnosis,
            )
            if escalation:
                logger.info("Escalation created: id=%s, status=pending", escalation["id"])
            else:
                logger.error("Failed to persist escalation for farmer %s", farmer["id"])

            # 4. Send language-appropriate acknowledgement (NOT the diagnosis)
            ack_messages = {
                "te": "ధన్యవాదాలు, మీ ఫోటో అందింది. వ్యవసాయ అధికారి త్వరలో సమీక్షించి మీకు సమాచారం అందిస్తారు.",
                "hi": "धन्यवाद, हमें आपकी फोटो मिल गई। एक कृषि अधिकारी जल्द समीक्षा करके आपको जवाब देंगे।",
                "en": "Thanks, we've received your photo. An agriculture officer will review and get back to you shortly.",
            }
            ack = ack_messages.get(farmer_language, ack_messages["en"])
            send_whatsapp_message(to_phone=from_phone_raw, body=ack)
            return Response(content="<Response></Response>", media_type="application/xml")

        # Process text message: Onboarding and Advisory State Machine
        farmer = get_farmer_by_phone(phone_number)

        if not farmer:
            logger.info(f"No farmer record found for {phone_number}. Initiating registration...")
            # Create a new farmer record in the "new" stage with pending village defaults
            farmer = create_farmer(
                phone=phone_number,
                name=profile_name,
                village_id="pending",
                language="te"  # Default Telugu as required
            )
            
            # Send message asking for village name/ID
            welcome_messages = {
                "te": "కిసాన్ అలర్ట్కి స్వాగతం! 🌾 రిజిస్ట్రేషన్ పూర్తి చేయడానికి మీ గ్రామం పేరు లేదా ID పంపండి.",
                "hi": "किसान अलर्ट में आपका स्वागत है! 🌾 पंजीकरण पूरा करने के लिए अपने गांव का नाम या ID भेजें।",
                "en": "Welcome to Kisan Alert! 🌾 Please reply with your Village ID or Village Name to complete registration.",
            }
            farmer_language = farmer.get("language", "te") if farmer else "te"
            reply_msg = welcome_messages.get(farmer_language, welcome_messages["en"])
            send_whatsapp_message(to_phone=from_phone_raw, body=reply_msg)
            return Response(content="<Response></Response>", media_type="application/xml")

        onboarding_stage = farmer.get("onboarding_stage", "new")
        logger.info(f"Farmer {farmer['id']} is in onboarding stage: '{onboarding_stage}'")

        if onboarding_stage == "new":
            # Since stage is "new" and this is an inbound text, treat it as the response with the village name/id
            village_id = body_text
            logger.info(f"Updating onboarding details for {farmer['id']}: stage=active, village_id={village_id}")
            update_success = update_farmer_onboarding(farmer["id"], stage="active", village_id=village_id)
            
            if not update_success:
                logger.error(f"Failed to update farmer {farmer['id']} onboarding details.")
                village_error_messages = {
                    "te": "క్షమించండి, మీ గ్రామ సమాచారం సెట్ చేయడంలో లోపం. దయచేసి మీ గ్రామం పేరు మళ్ళీ పంపండి.",
                    "hi": "क्षमा करें, आपकी गाँव की जानकारी सेट करने में त्रुटि हुई। कृपया अपना गाँव का नाम फिर से भेजें।",
                    "en": "Apologies, we encountered an error setting your village defaults. Please try sending your village name again.",
                }
                farmer_language = farmer.get("language", "te")
                reply_msg = village_error_messages.get(farmer_language, village_error_messages["en"])
                send_whatsapp_message(to_phone=from_phone_raw, body=reply_msg)
                return Response(content="<Response></Response>", media_type="application/xml")
            
            # Confirm registration and proceed to advise
            confirm_messages = {
                "te": "ధన్యవాదాలు! మీరు '{village_id}' గ్రామం కింద నమోదయ్యారు. మీ స్థానిక నేల సమాచారం మరియు పంట సిఫార్సులు తీసుకుంటున్నాము...",
                "hi": "धन्यवाद! आप '{village_id}' गाँव में पंजीकृत हो गए। आपकी स्थानीय मिट्टी और फसल सिफारिशें ला रहे हैं...",
                "en": "Thank you! You are registered under village '{village_id}'. Fetching your local soil data and crop recommendations now...",
            }
            farmer_language = farmer.get("language", "te")
            confirm_msg = confirm_messages.get(farmer_language, confirm_messages["en"]).format(village_id=village_id)
            send_whatsapp_message(to_phone=from_phone_raw, body=confirm_msg)

            # Proceed immediately to look up plot + soil + weather to return first advice
            await generate_and_send_advisory(farmer_id=farmer["id"], village_id=village_id, language=farmer.get("language", "te"), to_phone=from_phone_raw)
            return Response(content="<Response></Response>", media_type="application/xml")

        elif onboarding_stage == "active":
            # Active farmer requests advisory
            logger.info(f"Active farmer {farmer['id']} requested crop advice.")
            await generate_and_send_advisory(farmer_id=farmer["id"], village_id=farmer.get("village_id"), language=farmer.get("language", "te"), to_phone=from_phone_raw)
            return Response(content="<Response></Response>", media_type="application/xml")

        else:
            logger.warning(f"Unrecognized onboarding stage '{onboarding_stage}' for farmer {farmer['id']}")
            unknown_stage_messages = {
                "te": "నమస్కారం! మీ సలహా సేవలు కాన్ఫిగర్ చేస్తున్నాము. దయచేసి కొద్దిసేపట్లో మళ్ళీ చూడండి.",
                "hi": "नमस्कार! हम आपकी सलाह सेवाएँ कॉन्फ़िगर कर रहे हैं। कृपया कुछ देर बाद पुनः जांचें।",
                "en": "Hello! We are configuring your advisory services. Please check back shortly.",
            }
            farmer_language = farmer.get("language", "te")
            reply_msg = unknown_stage_messages.get(farmer_language, unknown_stage_messages["en"])
            send_whatsapp_message(to_phone=from_phone_raw, body=reply_msg)
            return Response(content="<Response></Response>", media_type="application/xml")

    except Exception as e:
        logger.error(f"Error handling WhatsApp webhook: {e}", exc_info=True)
        return Response(content="<Response></Response>", media_type="application/xml")
