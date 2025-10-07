
from rest_framework.decorators import api_view
from django.shortcuts import render
from django.core.mail import send_mail
from ..forms import ContactForm
from django.contrib.auth.models import User

from ..models import UserDashboardPreferences
from .authentication_views import login

def contact_view(request):
    alert_message = None

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']

            full_message = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"

            send_mail(
                subject=subject,
                message=full_message,
                from_email=None,
                recipient_list=['spellpalproject@gmail.com'],
            )

            alert_message = "Your message was sent successfully!"
            form = ContactForm()
    else:
        form = ContactForm()

    return render(request, 'contact.html', {'form': form, 'alert_message': alert_message})

@api_view(['GET'])
def experimental(request):
    return render(request, 'TestingSlice.html')



def home(request):
    return render(request,"home.html")




def covertest_page(request):
    return render(request, 'covertest.html')

def cover_page(request):
    if not request.user.is_authenticated:
        user = User.objects.get(username="GuestUser")
    else:
        user = request.user
    all_user_permissions = user.get_all_permissions()
    user_permissions = {
        "premium_access": 'auth.can_access_premium_spell_correction_models' in all_user_permissions,
        "standard_access": 'auth.can_access_standard_spell_correction_models' in all_user_permissions,
    }
    return render(request, 'TestingSlice.html', context={"user_permissions": user_permissions })

def dashboard_page(request):
    user = request.user
    if (user.is_authenticated) :
        user_profile = {
            "name": user.username,
            "joined_at": user.date_joined,
        }
        preference_list, created = UserDashboardPreferences.objects.get_or_create(user=user)
        if (created):
            user_preferences = []
        else:
            user_preferences = preference_list.preferences

        return render(request, 'dashboard.html', context={"user_profile":user_profile, "user_preferences": user_preferences})
    else:
        return login(request)

def success_view(request):
    return render(request, 'success.html')