const Card = ({ children, className = "", as: Component = "div" }) => {
    return <Component className={`card ${className}`}>{children}</Component>;
};

export default Card;
