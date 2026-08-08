import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

import { useEffect, useState } from "react";

function EnvironmentDialog({
  open,
  onClose,
  onSave,
  editData,
  sites,
}) {

  const [formData, setFormData] = useState({
    site_id: "",
    temperature: "",
    humidity: "",
    wind_speed: "",
    solar_irradiance: "",
    rainfall: "",
    air_pressure: "",
  });

  useEffect(() => {

    if (editData) {

      setFormData({
        site_id: editData.site_id,
        temperature: editData.temperature,
        humidity: editData.humidity,
        wind_speed: editData.wind_speed,
        solar_irradiance: editData.solar_irradiance,
        rainfall: editData.rainfall,
        air_pressure: editData.air_pressure,
      });

    } else {

      setFormData({
        site_id: "",
        temperature: "",
        humidity: "",
        wind_speed: "",
        solar_irradiance: "",
        rainfall: "",
        air_pressure: "",
      });

    }

  }, [editData, open]);

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = () => {

    onSave({
      site_id: Number(formData.site_id),
      temperature: Number(formData.temperature),
      humidity: Number(formData.humidity),
      wind_speed: Number(formData.wind_speed),
      solar_irradiance: Number(formData.solar_irradiance),
      rainfall: Number(formData.rainfall),
      air_pressure: Number(formData.air_pressure),
    });

  };

  return (

    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >

      <DialogTitle>

        {editData
          ? "Edit Environmental Record"
          : "Add Environmental Record"}

      </DialogTitle>

      <DialogContent>

        <TextField
          select
          fullWidth
          margin="normal"
          label="Site"
          name="site_id"
          value={formData.site_id}
          onChange={handleChange}
        >

          {sites.map((site) => (

            <MenuItem
              key={site.id}
              value={site.id}
            >
              {site.site_name}
            </MenuItem>

          ))}

        </TextField>

        <TextField
          fullWidth
          margin="normal"
          label="Temperature (°C)"
          name="temperature"
          type="number"
          value={formData.temperature}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Humidity (%)"
          name="humidity"
          type="number"
          value={formData.humidity}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Wind Speed (km/h)"
          name="wind_speed"
          type="number"
          value={formData.wind_speed}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Solar Irradiance"
          name="solar_irradiance"
          type="number"
          value={formData.solar_irradiance}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Rainfall (mm)"
          name="rainfall"
          type="number"
          value={formData.rainfall}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Air Pressure (hPa)"
          name="air_pressure"
          type="number"
          value={formData.air_pressure}
          onChange={handleChange}
        />

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          {editData ? "Update" : "Create"}
        </Button>

      </DialogActions>

    </Dialog>

  );
}

export default EnvironmentDialog;