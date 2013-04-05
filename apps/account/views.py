from django.http import HttpResponseRedirect
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout

def login_view(request):
  username = request.POST.get('username', "")
  password = request.POST.get('password', "")
  redirect = request.POST.get('redirect', "/")

  user = authenticate(username=username, password=password)
  if user is not None:
    if user.is_active:
      login(request, user)
      # Redirect to a success page.
      return HttpResponseRedirect(redirect)
    else:
      return HttpResponseRedirect(redirect)
      # Return a 'disabled account' error message
  else:
    return HttpResponseRedirect(redirect)
    # Return an 'invalid login' error message.

def logout_view(request):
  redirect = request.GET.get('redirect', "/")

  if request.user.is_authenticated():
    logout(request)
    return HttpResponseRedirect(redirect)
  else:
    return HttpResponseRedirect(redirect)