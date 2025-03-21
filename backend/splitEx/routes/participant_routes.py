from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

from ..models import db
from ..models.expense import Expense, ExpenseParticipant, SplitMethod
from ..models.user import User

participant_bp = Blueprint('participants', __name__)

@participant_bp.route('/<expense_id>/add', methods=['POST'])
@jwt_required()
def add_participant(expense_id):
    """Add a participant to an expense"""
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        #validate required fields
        required_fields = ['username']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        #get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        #check if current user is the payer or a participant
        if str(expense.payer_id) != user_id and not any(str(user.id) == user_id for user in expense.users):
            return jsonify({'error': 'You do not have permission to add participants to this expense'}), 403

        #find the user to add
        participant_user = User.query.filter_by(username=data['username']).first()
        if not participant_user:
            return jsonify({'error': f'User {data["username"]} not found'}), 404

        #check if user is already a participant
        if any(user.id == participant_user.id for user in expense.users):
            return jsonify({'error': f'User {data["username"]} is already a participant'}), 400

        #add user to expense participants
        expense.users.append(participant_user)

        #create participant entry with amount
        amount = data.get('amount', 0)
        if expense.split_method == SplitMethod.EQUAL:
            # Recalculate equal amounts for all participants
            num_participants = len(expense.users)
            equal_amount = expense.total_amount // num_participants

            # Update all existing participants
            for participant in expense.participants:
                participant.amount = equal_amount

            #create new participant with equal amount
            participant = ExpenseParticipant(
                expense_id=expense.id,
                user_id=participant_user.id,
                amount=equal_amount,
                item=data.get('item')
            )
        else:
            #for unequal split, use the specified amount
            participant = ExpenseParticipant(
                expense_id=expense.id,
                user_id=participant_user.id,
                amount=amount,
                item=data.get('item')
            )

        expense.participants.append(participant)
        db.session.commit()

        return jsonify({
            'message': f'User {data["username"]} added to expense',
            'participant_id': str(participant.id)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@participant_bp.route('/<expense_id>/update/<username>', methods=['PUT'])
@jwt_required()
def update_participant(expense_id, username):
    """Update a participant's details in an expense"""
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is the payer
        if str(expense.payer_id) != user_id:
            return jsonify({'error': 'Only the payer can update participant details'}), 403

        # Find the user
        participant_user = User.query.filter_by(username=username).first()
        if not participant_user:
            return jsonify({'error': f'User {username} not found'}), 404

        # Find the participant entry
        participant = ExpenseParticipant.query.filter_by(
            expense_id=expense.id,
            user_id=participant_user.id
        ).first()

        if not participant:
            return jsonify({'error': f'User {username} is not a participant in this expense'}), 404

        # Update fields
        if 'amount' in data:
            participant.amount = data['amount']

        if 'item' in data:
            participant.item = data['item']

        # Commit changes
        db.session.commit()

        return jsonify({
            'message': f'Participant {username} updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@participant_bp.route('/<expense_id>/remove/<username>', methods=['DELETE'])
@jwt_required()
def remove_participant(expense_id, username):
    """Remove a participant from an expense"""
    user_id = get_jwt_identity()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is the payer
        if str(expense.payer_id) != user_id:
            return jsonify({'error': 'Only the payer can remove participants'}), 403

        # Find the user
        participant_user = User.query.filter_by(username=username).first()
        if not participant_user:
            return jsonify({'error': f'User {username} not found'}), 404

        # Check if the user is a participant
        if not any(user.id == participant_user.id for user in expense.users):
            return jsonify({'error': f'User {username} is not a participant in this expense'}), 404

        # Remove user from expense.users
        expense.users.remove(participant_user)

        # Find and remove participant entry
        participant = ExpenseParticipant.query.filter_by(
            expense_id=expense.id,
            user_id=participant_user.id
        ).first()

        if participant:
            db.session.delete(participant)

        # If equal split, recalculate for remaining participants
        if expense.split_method == SplitMethod.EQUAL and expense.users:
            num_participants = len(expense.users)
            equal_amount = expense.total_amount // num_participants

            for participant in expense.participants:
                participant.amount = equal_amount

        db.session.commit()

        return jsonify({
            'message': f'Participant {username} removed successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@participant_bp.route('/<expense_id>/participants', methods=['GET'])
@jwt_required()
def get_expense_participants(expense_id):
    """Get all participants for an expense"""
    user_id = get_jwt_identity()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is a participant
        if not any(str(user.id) == user_id for user in expense.users):
            return jsonify({'error': 'You do not have permission to view this expense'}), 403

        # Get all participants
        participants_data = []
        for participant in expense.participants:
            participant_user = User.query.get(participant.user_id)
            participants_data.append({
                'username': participant_user.username,
                'name': participant_user.name,
                'amount': participant.amount,
                'item': participant.item,
                'is_payer': str(participant_user.id) == str(expense.payer_id)
            })

        return jsonify(participants_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
