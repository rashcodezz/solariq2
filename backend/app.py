from dotenv import load_dotenv 
load_dotenv()
import logging
from flask import Flask
from flask_cors import CORS
from config import Config
from routes.predict import predict_bp
from services.solar import load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(predict_bp)
    with app.app_context():
        load_model()

    logger.info("SolarIQ backend started successfully")
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)


