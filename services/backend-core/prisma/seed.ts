import { PrismaClient, PumpStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const tomatoZone = await prisma.cropZone.create({
        data: {
            name: 'North Field - Tomatoes',
            cropType: 'Tomato',
            targetMoistureMin: 35.0,
            targetMoistureMax: 65.0,
            targetTemperature: 28.0,
            devices: {
                create: [
                    {
                        name: 'Telemetry Unit Alpha (ESP32)',
                        pumpStatus: PumpStatus.OFF,
                    },
                ],
            },
        },
        include: { devices: true },
    });

    console.log(`✅ Seeded CropZone: ${tomatoZone.name} with Device ID: ${tomatoZone.devices[0].id}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });