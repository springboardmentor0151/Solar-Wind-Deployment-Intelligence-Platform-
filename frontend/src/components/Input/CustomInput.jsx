import { TextField } from "@mui/material";

function CustomInput({

    label,

    type="text",

    value,

    onChange

}){

    return(

        <TextField

            fullWidth

            margin="normal"

            label={label}

            type={type}

            value={value}

            onChange={onChange}

            variant="outlined"

            sx={{

                "& .MuiOutlinedInput-root":{

                    borderRadius:"14px",

                    background:"rgba(255,255,255,.75)"

                }

            }}

        />

    )

}

export default CustomInput;