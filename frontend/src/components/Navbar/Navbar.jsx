import styles from "./Navbar.module.css";

import {
    Bell,
    Search
} from "lucide-react";

function Navbar(){

    return(

        <header className={styles.navbar}>

            <div>

                <h2>Good Morning 👋</h2>

                <p>
                    Renewable Energy Intelligence Platform
                </p>

            </div>

            <div className={styles.right}>

                <div className={styles.search}>

                    <Search size={18}/>

                    <input
                        placeholder="Search projects..."
                    />

                </div>

                <Bell className={styles.icon}/>

                <div className={styles.avatar}>
                    S
                </div>

            </div>

        </header>

    )

}

export default Navbar;