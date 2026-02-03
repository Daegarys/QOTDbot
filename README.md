# QOTDbot
[![Build and Test](https://github.com/Deagarys/QOTDbot/actions/workflows/pr-test.yml/badge.svg)](https://github.com/Deagarys/QOTDbot/actions/workflows/pr-test.yml)
[![CodeQL](https://github.com/Deagarys/QOTDbot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Deagarys/QOTDbot/actions/workflows/github-code-scanning/codeql)
[![Deploy to Docker](https://github.com/Deagarys/QOTDbot/actions/workflows/deploy-docker.yml/badge.svg)](https://github.com/Deagarys/QOTDbot/actions/workflows/deploy-docker.yml)
[![Deploy to GitHub](https://github.com/Deagarys/QOTDbot/actions/workflows/deploy-git.yml/badge.svg)](https://github.com/Deagarys/QOTDbot/actions/workflows/deploy-git.yml)

## Overview
QOTDbot is a Discord bot designed to ask a "Question of the Day" (QOTD) in a specified channel. It is built using JavaScript and the `discord.js` library.

## Features
- Ask a daily question in a designated channel.
- Permission checks to ensure only authorized users can trigger the QOTD command.
- Configurable via environment variables.

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/Deagarys/QOTDbot.git
    cd QOTDbot
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file based on the `.env.example` file and fill in the required values:
    ```sh
    cp .env.example .env
    ```

## Usage
1. Start the bot:
    ```sh
    npm start
    ```

2. Use the `/qotd` command in your Discord server to ask the question of the day.

## Environment Variables
- `TOKEN`: Your Discord bot token.
- `TEST_SERVER`: ID of the test server.
- `SERVER_ID`: ID of the main server.
- `MONGO_URI`: MongoDB connection string.
- `OPENAI_API_KEY`: OpenAI API key for AI-generated fallback QOTDs.
- `OPENAI_MODEL`: OpenAI model name for AI-generated fallback QOTDs (defaults to `gpt-5-mini` if missing).
- `LOG_CHANNEL_ID`: ID of the log channel.
- `QOTD_CHANNEL_ID`: ID of the QOTD channel.
- `QOTD_ROLE_ID`: ID of the QOTD role.
- `QOTD_HISTORY_LIMIT`: Number of previously asked questions to send for AI context (defaults to `25` if missing/invalid).
- `BOT_ID`: ID of the bot.
- `CRON`: Cron expression for scheduling the QOTD.

## Contributing
Feel free to submit issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
