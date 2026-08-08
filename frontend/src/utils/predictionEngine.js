export function calculateSolarScore(env) {

    if (!env) return 0;

    let score = 0;

    // Solar Irradiance (0-40)
    score += Math.min(env.solar_irradiance / 25, 40);

    // Temperature (ideal 25-35°C)
    if (env.temperature >= 25 && env.temperature <= 35)
        score += 20;
    else
        score += 10;

    // Low Rainfall
    if (env.rainfall < 50)
        score += 20;
    else
        score += 10;

    // Moderate Humidity
    if (env.humidity <= 70)
        score += 20;
    else
        score += 10;

    return Math.round(score);
}

export function calculateWindScore(env) {

    if (!env) return 0;

    let score = 0;

    // Wind Speed
    score += Math.min(env.wind_speed * 4, 50);

    // Air Pressure
    if (env.air_pressure >= 1000)
        score += 20;
    else
        score += 10;

    // Humidity
    if (env.humidity < 70)
        score += 15;
    else
        score += 8;

    // Temperature
    if (env.temperature < 35)
        score += 15;
    else
        score += 8;

    return Math.round(score);
}