from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
from datetime import datetime

from ..models import db
from ..models.expense import Expense, SplitMethod
from ..models.user import User
from ..models.expense import ExpenseParticipant

expense_bp = Blueprint('expenses', __name__)

@expense_bp.route('/', methods=['POST'])
@jwt_required()
def create_expense():
    """new expense"""
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # validate required fields
        required_fields = ['title', 'total_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # get split method or use default
        split_method = SplitMethod.EQUAL
        if 'split_method' in data and data['split_method'] == 'unequal':
            split_method = SplitMethod.UNEQUAL

        new_expense = Expense(
            title=data['title'],
            total_amount=data['total_amount'],
            split_method=split_method,
            date=datetime.strptime(data.get('date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d'),
            payer_id=uuid.UUID(user_id)
        )

        # add current user as a participant
        current_user = User.query.get(uuid.UUID(user_id))
        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        new_expense.users.append(current_user)

        # calculate default amount for equal split (just the user for now)
        default_amount = data['total_amount']

        # Add the current user as a participant
        participant = ExpenseParticipant(
            expense_id=new_expense.id,
            user_id=uuid.UUID(user_id),
            amount=default_amount,
            item=data.get('item')
        )
        new_expense.participants.append(participant)

        db.session.add(new_expense)
        db.session.commit()

        return jsonify({
            'message': 'Expense created successfully',
            'expense_id': str(new_expense.id)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_expenses():
    """Get all expenses for the current user"""
    user_id = get_jwt_identity()

    try:
        # Get user object
        user = User.query.get(uuid.UUID(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Query all expenses for user
        expenses = db.session.query(Expense).join(
            Expense.users
        ).filter(
            User.id == uuid.UUID(user_id)
        ).all()

        result = []
        for expense in expenses:
            participants_data = []
            for participant in expense.participants:
                participant_user = User.query.get(participant.user_id)
                participants_data.append({
                    'username': participant_user.username,
                    'amount': participant.amount,
                    'item': participant.item
                })

            # Format paid_by username
            paid_by = None
            if expense.payer_id:
                payer = User.query.get(expense.payer_id)
                paid_by = payer.username if payer else None

            result.append({
                'id': str(expense.id),
                'title': expense.title,
                'date': expense.date.strftime('%Y-%m-%d'),
                'split_method': expense.split_method.value,
                'total_amount': expense.total_amount,
                'created_at': expense.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'paid_by': paid_by,
                'participants': participants_data
            })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<expense_id>', methods=['GET'])
@jwt_required()
def get_expense_details(expense_id):
    """Get details of a specific expense (public route requiring participant membership)"""
    user_id = get_jwt_identity()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is a participant
        user_is_participant = any(str(user.id) == user_id for user in expense.users)
        if not user_is_participant:
            return jsonify({'error': 'You do not have permission to view this expense'}), 403

        # Get participant details
        participants_data = []
        for participant in expense.participants:
            participant_user = User.query.get(participant.user_id)
            participants_data.append({
                'username': participant_user.username,
                'amount': participant.amount,
                'item': participant.item
            })

        # Format paid_by username
        paid_by = None
        if expense.payer_id:
            payer = User.query.get(expense.payer_id)
            paid_by = payer.username if payer else None

        result = {
            'id': str(expense.id),
            'title': expense.title,
            'date': expense.date.strftime('%Y-%m-%d'),
            'split_method': expense.split_method.value,
            'total_amount': expense.total_amount,
            'created_at': expense.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'paid_by': paid_by,
            'participants': participants_data
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an expense (only by the owner/payer)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is the payer
        if str(expense.payer_id) != user_id:
            return jsonify({'error': 'Only the payer can update this expense'}), 403

        # Update allowed fields
        if 'title' in data:
            expense.title = data['title']

        if 'date' in data:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d')

        if 'total_amount' in data:
            expense.total_amount = data['total_amount']

        if 'split_method' in data:
            expense.split_method = SplitMethod.UNEQUAL if data['split_method'] == 'unequal' else SplitMethod.EQUAL

        # Update the expense
        expense.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Expense updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense (only by the owner/payer)"""
    user_id = get_jwt_identity()

    try:
        # Get the expense
        expense = Expense.query.get(uuid.UUID(expense_id))
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        # Check if current user is the payer
        if str(expense.payer_id) != user_id:
            return jsonify({'error': 'Only the payer can delete this expense'}), 403

        # Delete the expense
        db.session.delete(expense)
        db.session.commit()

        return jsonify({'message': 'Expense deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
