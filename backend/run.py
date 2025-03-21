from splitEx import create_app
from splitEx.models import db
from splitEx.models.user import User
from splitEx.models.expense import Expense
import os

app = create_app()

@app.shell_context_processor
def make_shell_context():
  return {
    "db": db,
    "User": User,
    "Expense": Expense
  }


if __name__ == "__main__":
  port = int(os.environ.get("PORT", 3000))
  app.run(host="0.0.0.0", port=port)
