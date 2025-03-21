from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required, create_access_token
from werkzeug.security import generate_password_hash
import re
from uuid import UUID

from ..models import db
from ..models.user import User


auth_bp = Blueprint("auth_bp", __name__)


def is_valid_password(password):
    return re.match(r'^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,16}$', password) is not None

@auth_bp.route("/register", methods=['POST'])
def register_user():
    data = request.json or {}

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    ipAddress = request.remote_addr

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are mandatory."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken."}), 400

    if not is_valid_password(password):
        return jsonify({"error": "Password must be 6-16 characters, include at least 1 uppercase letter and 1 number."}), 400

    new_user = User(
        email=email,
        username=username.lower(),
        name=username,
        password_hash=generate_password_hash(password),
        ipAddress=ipAddress,
    )

    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=new_user.id)
    return jsonify({"token":access_token}), 200

@auth_bp.route("/login", methods=['POST'])
def login_user():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are mandatory."}), 400

    user_data = User.query.filter_by(email=email).first()
    if not user_data:
        return jsonify({"error": "User not found. Check provided data again or SignUp if new."}), 401

    user = user_data

    if not user.check_password(password):
        return jsonify({"error": "Invalid password."}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({"token":access_token}), 200

@auth_bp.route('/u', methods=["GET"])
@jwt_required()
def get_user_data():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(id=UUID(current_user_id)).first()
    # .first_or_404()

    if not user:
        return jsonify({'error':'user not found'}), 404

    return jsonify({
        "email": user.email,
        "username": user.username,
        "name": user.name,
        # "expenses": user.expenses, # send later, no need to query another table, cuz this route will be used many times
    }), 200
