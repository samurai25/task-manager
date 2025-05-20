from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Кастомный обработчик ошибок для DRF
    """
    # Стандартный ответ от DRF
    response = exception_handler(exc, context)

    if response is not None:
        # Формируем свой формат ошибок
        custom_response_data = {
            'error': 'Ошибка валидации',
            'details': response.data
        }
        return Response(custom_response_data, status=response.status_code)

    return response
