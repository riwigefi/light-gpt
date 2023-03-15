# light-gpt

Light-GPT is an interactive website project based on the GPT-3.5-Turbo Model.

This is a small application built using the Next.js framework and deployed on the Vercel platform.

Application experience address: https://light-gpt.vercel.app Repository address: https://github.com/riwigefi/light-gpt

## Features

1. This is a pure front-end application based on the gpt-3.5-turbo model that supports context-based conversations and API key access to the OpenAI service.
2. Users can set avatars for both parties in the conversation (user avatar and robot avatar).
3. Users can set their own OpenAI API key to ensure fast access. The API key set by the user will be saved on the client side and will not be leaked. Of course, for direct experience, the application has a pre-set API key for users to use directly.
4. GPT replies support syntax highlighting and one-click code copying (PC only).
   Conversations support exporting images and PDF documents.
5. The application has been adapted for both PC and mobile devices for easy use.

It took one week from idea to implementation, and everyone is welcome to experience and use it. Any feedback and suggestions for improvement are also welcome.

If this application sharing can inspire and help others, it would be the greatest significance of my project. If it's not too much trouble, I would also be very grateful if you could give my project a star.

## how to deploy local

To deploy this application locally, you need to follow the following steps:

1. Clone the project to your local machine:

```bash
git clone https://github.com/riwigefi/light-gpt.git
```

2. Navigate to the project directory and install the dependencies:

```bash
cd light-gpt
pnpm install
```

If you don't have an OpenAI API key, you can leave it blank in the .env.local file and use the default API key in the application.

3. Start the application:

```bash
pnpm run dev
```

The application will start at http://localhost:3000.

Now, you can access the application locally and test it，enter your API key，and start to chat.
