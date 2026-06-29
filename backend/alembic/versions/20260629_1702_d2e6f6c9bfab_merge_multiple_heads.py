"""merge multiple heads

Revision ID: d2e6f6c9bfab
Revises: 95528b16e7e2, c1a2b3c4d5e6
Create Date: 2026-06-29 17:02:13.223042

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2e6f6c9bfab'
down_revision: Union[str, None] = ('95528b16e7e2', 'c1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
