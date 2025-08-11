from django.core.management import BaseCommand
from faker import Faker
import api.models as md

class Command(BaseCommand):
    def handle(self, *args, **options):
        fake = Faker()

        for i in range(50):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = fake.email()
            user = md.User(email,first_name,last_name,email)
            user.save()

