import json
import os
import urllib.request
from datetime import datetime, timezone, timedelta

SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL')
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://coekar.com')


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }


def lambda_handler(event, context):
    # CORS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }

    try:
        body = json.loads(event.get('body', '{}'))
        organization = body.get('organization')
        department = body.get('department')
        name = body.get('name')
        email = body.get('email')
        phone = body.get('phone')
        message = body.get('message', 'なし')

        # Validation
        if not all([organization, department, name, email, phone]):
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Required fields are missing'})
            }

        # 日本時間
        jst = timezone(timedelta(hours=9))
        now = datetime.now(jst).strftime('%Y/%m/%d %H:%M:%S')

        # Slack message
        slack_message = {
            'blocks': [
                {
                    'type': 'header',
                    'text': {
                        'type': 'plain_text',
                        'text': '📩 コエカル 新規資料請求',
                        'emoji': True
                    }
                },
                {
                    'type': 'section',
                    'fields': [
                        {'type': 'mrkdwn', 'text': f'*医療機関名*\n{organization}'},
                        {'type': 'mrkdwn', 'text': f'*部署名*\n{department}'}
                    ]
                },
                {
                    'type': 'section',
                    'fields': [
                        {'type': 'mrkdwn', 'text': f'*お名前*\n{name}'},
                        {'type': 'mrkdwn', 'text': f'*メールアドレス*\n{email}'}
                    ]
                },
                {
                    'type': 'section',
                    'fields': [
                        {'type': 'mrkdwn', 'text': f'*電話番号*\n{phone}'},
                        {'type': 'mrkdwn', 'text': f'*その他ご要望*\n{message or "なし"}'}
                    ]
                },
                {
                    'type': 'context',
                    'elements': [
                        {'type': 'mrkdwn', 'text': f'送信日時: {now}'}
                    ]
                }
            ]
        }

        # Send to Slack
        req = urllib.request.Request(
            SLACK_WEBHOOK_URL,
            data=json.dumps(slack_message).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req) as res:
            if res.status != 200:
                raise Exception(f'Slack API error: {res.status}')

        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'success': True})
        }

    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }
