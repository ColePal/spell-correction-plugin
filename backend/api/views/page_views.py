
from rest_framework.decorators import api_view
from django.shortcuts import render
from django.core.mail import send_mail
from ..forms import ContactForm

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
    return render(request, 'TestingSlice.html')

def dashboard_page(request):
    return render(request, 'dashboard.html')

def success_view(request):
    return render(request, 'success.html')