from app.services.ml_prediction import predict_solar_power

prediction = predict_solar_power(
    temperature=28,
    rainfall=0,
    rhoa=1.18,
    irradiance_g=650,
    irradiance_a=900,
    cloud=0.1,
)

print(prediction)