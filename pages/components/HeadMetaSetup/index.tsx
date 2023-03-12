import Head from 'next/head';

const HeadMeatSetup = () => {
    return (
        <Head>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />
            <meta
                name="description"
                content="Light-GPT is an interactive website project b"
            />

            <meta name="keywords" content="Next.js,ChatGPT,GPT,AI" />

            <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        </Head>
    );
};

export default HeadMeatSetup;
