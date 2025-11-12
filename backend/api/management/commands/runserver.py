import os
import subprocess
from django.core.management.commands.runserver import Command as RunserverCommand

class Command(RunserverCommand):
    help = "Starts Django dev server and Vite dev server."

    def inner_run(self, *args, **kwargs):
        if kwargs.get("use_threading", True):  # or settings.DEBUG
        # start Vite
            # Start Vite dev server
            vite_process = subprocess.Popen(
                ["npm", "run", "dev"], cwd=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "../../frontend")
            )

            try:
                super().inner_run(*args, **kwargs)  # Run Django server
            finally:
                vite_process.terminate()  # Kill Vite when Django stops
