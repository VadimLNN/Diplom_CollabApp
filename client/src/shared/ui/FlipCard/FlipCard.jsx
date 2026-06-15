import React from "react";
import styles from "./FlipCard.module.css";

const FlipCard = ({ frontContent, backContent, className }) => {
    return (
        <div className={`${styles.card} ${className || ""}`}>
            <div className={styles.cardInner}>
                <div className={`${styles.cardFace} ${styles.cardFront}`}>{frontContent}</div>
                <div className={`${styles.cardFace} ${styles.cardBack}`}>{backContent}</div>
            </div>
        </div>
    );
};

export default FlipCard;
