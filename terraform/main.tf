
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "sns_publish_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSNSFullAccess"
}

resource "aws_sns_topic" "sms_topic" {
  name = "sms-topic"
}

resource "aws_lambda_function" "send_sms_lambda" {
  filename      = "../lambdas/send-sms.zip"
  function_name = "send-sms"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  source_code_hash = filebase64sha256("../lambdas/send-sms.zip")

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.sms_topic.arn
    }
  }
}

resource "aws_lambda_function" "receive_sms_lambda" {
  filename      = "../lambdas/receive-sms.zip"
  function_name = "receive-sms"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  source_code_hash = filebase64sha256("../lambdas/receive-sms.zip")
}

resource "aws_sns_topic_subscription" "lambda_subscription" {
  topic_arn = aws_sns_topic.sms_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.receive_sms_lambda.arn
}

resource "aws_lambda_permission" "sns_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.receive_sms_lambda.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.sms_topic.arn
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.send_sms_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "send_sms_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /send-sms"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "api_gw_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_sms_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
