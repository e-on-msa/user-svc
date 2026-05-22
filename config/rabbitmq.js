const amqp = require('amqplib');

let channel = null;

// RabbitMQ 연결 및 채널 생성
async function connect() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        console.log('RabbitMQ 연결 성공');

        // 연결 끊기면 재연결
        connection.on('close', () => {
            console.warn('RabbitMQ 연결 끊김. 5초 후 재연결 시도...');
            channel = null;
            setTimeout(connect, 5000);
        });
    } catch (err) {
        console.warn('RabbitMQ 연결 실패 (나중에 Docker로 띄울 예정):', err.message);
        setTimeout(connect, 5000);
    }
}

// 이벤트 발행
async function publish(exchange, routingKey, payload) {
    if (!channel) {
        console.warn(`[RabbitMQ] channel 없음. 이벤트 발행 스킵: ${routingKey}`);
        return;
    }

    try {
        // exchange 선언 (없으면 생성)
        await channel.assertExchange(exchange, 'topic', { durable: true });

        channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true } // 서버 재시작해도 메시지 유지
        );

        console.log(`[RabbitMQ] 이벤트 발행: ${routingKey}`, payload);
    } catch (err) {
        console.error(`[RabbitMQ] 이벤트 발행 실패: ${routingKey}`, err.message);
    }
}

module.exports = { connect, publish };
