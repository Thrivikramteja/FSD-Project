import styles from './footer.module.css'

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles["footer-container"]}>
                <div className={styles["footer-section"]}>
                    <h3>About CareConnect</h3>
                    <p>
                        CareConnect bridges NGOs, care homes, and generous donors. We empower
                        individuals to support meaningful initiatives and create lasting impact
                        in the lives of those in need.
                    </p>
                </div>

                <div className={styles["footer-section"]}>
                    <h3>Quick Links</h3>
                    <ul className={styles["footer-links"]}>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Discover NGOs</a></li>
                        <li><a href="#">Find Care Homes</a></li>
                        <li><a href="#">Current Fundraisers</a></li>
                        <li><a href="#">Donate Food/Clothes</a></li>
                        <li><a href="#">User Dashboard</a></li>
                    </ul>
                </div>

                <div className={styles["footer-section"]}>
                    <h3>Newsletter</h3>
                    <p>Stay updated with our latest fundraisers and success stories.</p>
                    <div className={styles["newsletter-signup"]}>
                        <input type="email" placeholder="Your email" />
                        <button>Subscribe</button>
                    </div>
                </div>

                <div className={styles["footer-section"]}>
                    <h3>Contact Us</h3>
                    <form className={styles["contact-form"]}>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <textarea placeholder="Message" rows="3"></textarea>
                        <button type="submit">Send Message</button>
                    </form>
                </div>
            </div>

            <div className={styles["footer-bottom"]}>
                <p>&copy; 2025 CareConnect. All rights reserved.</p>
                <p>
                    Created by T. Thrivikram teja, CH. Karthik babu, B. Nitish kumar reddy, K.
                    Chandoo vardhan, CH. Venkata dheeraj
                </p>
            </div>
        </footer>

    );
}

export default Footer;  