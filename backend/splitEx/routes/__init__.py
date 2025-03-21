from .auth_routes import auth_bp
from .expense_routes import expense_bp
from .participant_routes import participant_bp

def init_app(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(expense_bp, url_prefix='/api/expenses')
    app.register_blueprint(participant_bp, url_prefix='/api/participants')
