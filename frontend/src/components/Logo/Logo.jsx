import { Sun } from "lucide-react";

import { Typography, Stack } from "@mui/material";

function Logo(){

    return(

        <Stack

            alignItems="center"

            spacing={1}

            mb={3}

        >

            <Sun

                size={55}

                color="#FFC107"

            />

            <Typography

                variant="h4"

                fontWeight={700}

            >

                SolarWind

            </Typography>

            <Typography

                color="text.secondary"

            >

                Deployment Intelligence

            </Typography>

        </Stack>

    )

}

export default Logo;