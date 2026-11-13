"""Deploy the local Bean Beacon production Compose stack.

Usage: pyinfra @local deploy.py
"""

from pyinfra.operations import server

server.shell(
    name="Deploy Bean Beacon local production stack",
    commands=[
        "docker compose -f docker-compose.prod.yml up -d --build --remove-orphans",
        "docker compose -f docker-compose.prod.yml ps",
    ],
)
