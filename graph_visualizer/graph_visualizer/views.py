from django.shortcuts import render


def index(request):
    datasource_plugins = None
    return render(request, 'index.html', {'title': 'Index', 'datasource_plugins': datasource_plugins})