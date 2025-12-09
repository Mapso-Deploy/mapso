import React from 'react'
// import { Link } from 'react-router-dom'; // Import Link
// import { Link, useHistory } from 'react-router-dom'; // Import Link // Keep useHistory for now
import { useHistory } from 'react-router-dom'; // Keep for now to avoid breaking other parts if any


export default function Model(props) { // Component name is Model, filename is ModelsMapped
    const history = useHistory(); // Still used by the Link for now, will be removed carefully
    let clickStart = 0; // Track when the mouse is pressed

    const handleMouseDown = () => {
        clickStart = new Date().getTime(); // Record time when mouse is pressed
    };

    const handleMouseUp = (product) => { // Changed to pass the whole product
        const clickDuration = new Date().getTime() - clickStart; // Calculate click duration
        if (clickDuration < 200) { // If the duration is less than 200 milliseconds, treat as a click
            // history.push(`/products/${productId}`); // OLD: Navigate to product details
            if (props.onProductClick) { // NEW: Call the callback to open modal
                props.onProductClick(product);
            }
        }
        // If it was a drag (clickDuration >= 200), do nothing, model-viewer handles rotation
    };


    console.log('model props', props)
    return (
        <>
            <div className="models-mapped-container">
                <div className="models-mapped">
                    {props.products.map(product =>
                        <div className="Title" key={product.id}>
                            {/* <h6>{props.item.name}</h6> */}
                            <div className="Center">
                                <model-viewer class="model" interaction-prompt="none" data-js-focus-visible
                                    src={product.image}
                                    alt={product.name}
                                    camera-controls min-camera-orbit="auto 90deg auto" max-camera-orbit="auto 90deg 7.699m"
                                    min-field-of-view="45deg" max-field-of-view="45deg" camera-orbit="-90deg 90deg 7.699m"
                                    poster={product.poster}
                                    style={{ '--poster-color': 'transparent' }}
                                    loading="eager" auto-rotate
                                    onMouseDown={handleMouseDown} // Keep this
                                    onMouseUp={() => handleMouseUp(product)} // Pass the full product object
                                >
                                    <div class="progress-bar hide" slot="progress-bar">
                                        <div class="update-bar"></div>
                                    </div>
                                </model-viewer>
                                {/* Modified Link to use onProductClick for consistency */}
                                <div onClick={() => props.onProductClick ? props.onProductClick(product) : history.push(`/products/${product.id}`)} className="product-info-link">
                                    <p className="product-info" style={{ whiteSpace: "pre" }}>{product.name} {'    '} ${product.price}</p>
                                </div>
                                <div className="buy-buttons">
                                    <span>
                                        <button class="buy-button-new snipcart-add-item"
                                            data-item-id={product.id}
                                            data-item-price={product.price}
                                            data-item-description={product.description}
                                            // data-item-url={`https://mapso.co/products/${product.id}`}  // Make sure this is an absolute URL
                                            data-item-url={product.url}
                                            // data-item-image={product.image}
                                            data-item-name={product.name}
                                            data-item-custom1-name={product.custom1Name}
                                            data-item-custom1-options={product.custom1Options}
                                            data-item-custom2-name={product.custom2Name}
                                            data-item-custom2-options={product.custom2Options} >
                                            Add to cart
                                        </button>
                                        <p class="divider">|</p>
                                    </span>
                                    <span>
                                        <button class="btc-buy-button-new"><a class="buy-with-crypto" href={product.crypto}>₿</a></button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}




