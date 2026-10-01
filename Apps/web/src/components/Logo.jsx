import {Box} from "@mui/material"


export default function Logo() {
/*  
    egggggg heart Twammy 
*/
    return (<Box
        component="img"
        sx={{
            height: 300,
            width: 350,
            maxHeight: { xs: 105, md: 120 },
            maxWidth: { xs: 300, md: 250 },

        }}
        alt="The house from the top of the hill"
        src="/logo.jpeg"
    />);
}