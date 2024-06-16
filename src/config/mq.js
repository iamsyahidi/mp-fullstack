import amqp from "amqplib";
import dotenv from "dotenv";

const env = dotenv.config().parsed;
let channel = null;
let mqConnection = null;

const initRabbitMQ = async () => {
  try {
    mqConnection = await amqp.connect(env.RABBITMQ_URI);
    channel = await mqConnection.createChannel();

    await channel.assertQueue(env.RABBITMQ_UPDATE_USER_TOPIC);
    await channel.assertExchange(
      env.RABBITMQ_UPDATE_USER_EXCHANGE,
      env.RABBITMQ_UPDATE_USER_EXCHANGE_TYPE
    );
    await consumeUpdateUser();

    console.log("Connected to rabbit mq");
  } catch (error) {
    console.error("Connection error: ", error);
    process.exit(1);
  }
};

const consumeUpdateUser = async () => {
  await channel.consume(
    env.RABBITMQ_UPDATE_USER_TOPIC,
    async (msg) => {
      console.log(
        `Received from [${env.RABBITMQ_UPDATE_USER_TOPIC}] : ${Buffer.from(
          msg?.content
        )}`
      );
      channel.ack(msg);
    },
    {
      noAck: false,
      consumerTag: env.RABBITMQ_UPDATE_USER_TAG,
      prefetch: 1,
      isConsumerTagAutoGenerate: true,
    }
  );
};

export { initRabbitMQ, channel, mqConnection };
