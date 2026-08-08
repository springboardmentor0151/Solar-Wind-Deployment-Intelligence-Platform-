import { Button } from "@mui/material";

function PrimaryButton({
    children,
    onClick,
    type = "button",
    fullWidth = true
}) {

    return (

        <Button

            type={type}

            fullWidth={fullWidth}

            variant="contained"

            onClick={onClick}

            sx={{

                mt:2,

                py:1.5,

                borderRadius:"14px",

                fontWeight:600,

                textTransform:"none",

                fontSize:"1rem",

                background:
                    "linear-gradient(90deg,#1565C0,#2E7D32)",

                transition:"0.3s",

                "&:hover":{

                    transform:"translateY(-2px)",

                    boxShadow:"0 8px 20px rgba(21,101,192,.35)"

                }

            }}

        >

            {children}

        </Button>

    );

}

export default PrimaryButton;