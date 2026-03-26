from flask import Blueprint, request, jsonify, send_file
from services.weather import fetch_weather
from io import BytesIO
from services.solar import is_model_loaded, validate_inputs, predict_solar
from services.pdf_report import build_pdf
predict_bp = Blueprint("predict", __name__)

@predict_bp.route("/api/predict", methods=["POST"])
def predict():
    if not is_model_loaded():
        return jsonify({"error": "Model not loaded on server"}), 500

@predict_bp.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}

    # extract and validate inputs
    try:
        lat        = float(data["lat"])
        lng        = float(data["lng"])
        roof_area  = float(data["roofArea"])
        efficiency = float(data["efficiency"])
        tariff     = float(data["tariff"])
        system_cost = float(data["systemCost"])
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Missing or invalid field: {e}"}), 400

    errors = validate_inputs(lat, lng, roof_area, efficiency, tariff, system_cost)
    if errors:
        return jsonify({"errors": errors}), 400

    # fetch weather and predict
    try:
        weather = fetch_weather(lat, lng)
        result = predict_solar(weather, lat, lng, roof_area, efficiency, tariff, system_cost)
        return jsonify({
            "location": {"lat": lat, "lng": lng},
            "weather":  weather,
            "result":   result
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

@predict_bp.route("/api/report", methods=["POST"])
def download_report():
    data = request.get_json() or {}

    result   = data.get("result", {})
    location = data.get("location", {})

    if not result or not location:
        return jsonify({"error": "Missing result or location"}), 400

    try:
        pdf_bytes = build_pdf(result, location)
        buffer = BytesIO(pdf_bytes)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="solariq_report.pdf"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"PDF generation failed: {e}"}), 500