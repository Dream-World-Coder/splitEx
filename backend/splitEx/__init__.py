from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .configs import configs_dictionary

from .models import init_app as init_db
from .routes import init_app as init_routes


def create_app(configs_dictionary_key="dev"):
    app = Flask(__name__)
    app.config.from_object(configs_dictionary[configs_dictionary_key])

    # cors
    cors = CORS()
    cors.init_app(app, origins=["http://localhost:5173","http://127.0.0.1:5173","https://splitexx.netlify.app"])

    # jwt
    JWTManager(app)

    # models
    init_db(app)

    # routes
    init_routes(app)

    return app
