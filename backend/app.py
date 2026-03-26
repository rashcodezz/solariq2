from dotenv import load_dotenv
load_dotenv()

import logging
from flask import Flask, jsonify
from flask_cors import CORS
from routes.predict import predict_bp
from services.solar import load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app, origins=[
        "http://localhost:5173",
        "https://rococo-conkies-0ea6dd.netlify.app/"
    ])
    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})


    app.register_blueprint(predict_bp)

    with app.app_context():
        load_model()

    logger.info("SolarIQ backend started successfully")
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)