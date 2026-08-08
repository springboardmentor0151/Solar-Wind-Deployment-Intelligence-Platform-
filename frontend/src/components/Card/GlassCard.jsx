import { Paper } from "@mui/material";

function GlassCard({ children }) {

    return (

        <Paper

            elevation={0}

            sx={{

                width:430,

                p:5,

                borderRadius:"28px",

                backdropFilter:"blur(18px)",

                background:"rgba(255,255,255,.18)",

                border:"1px solid rgba(255,255,255,.25)",

                boxShadow:"0 10px 40px rgba(0,0,0,.25)"

            }}

        >

            {children}

        </Paper>

    );

}

export default GlassCard;