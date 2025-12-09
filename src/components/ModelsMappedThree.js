import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeModel from './threejs/ThreeModel';

export default function ModelsMappedThree(props) {
    const navigate = useNavigate();
    let clickStart = 0;

    const handleMouseDown = () => {
        clickStart = new Date().getTime();
    };

    const handleMouseUp = (product) => {
        const clickDuration = new Date().getTime() - clickStart;
        if (clickDuration < 200) {
            if (props.onProductClick) {
                props.onProductClick(product);
            }
        }
    };

    console.log('Three.js model props', props);

    return (
        <>
            <div className="models-mapped-container">
                <div className="models-mapped">
                    {props.products.map(product => (
                        <div className="Title" key={product.id}>
                            <div className="Center">
                                <Suspense fallback={
                                    <div style={{
                                        width: '100%',
                                        height: '300px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(0,0,0,0.1)'
                                    }}>
                                        <div className="progress-bar">
                                            <div className="update-bar"></div>
                                        </div>
                                    </div>
                                }>
                                    <ThreeModel
                                        key={`three-model-${product.id}`}
                                        className="model three-model"
                                        src={product.image}
                                        alt={product.name}
                                        onMouseDown={handleMouseDown}
                                        onMouseUp={() => handleMouseUp(product)}
                                        onModelClick={() => handleMouseUp(product)}
                                        style={{
                                            height: '300px',
                                            width: '100%',
                                            transform: 'translateX(-35px)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            '--poster-color': 'transparent'
                                        }}
                                    />
                                </Suspense>

                                {/* Product info link - preserve existing functionality */}
                                <div
                                    onClick={() => props.onProductClick ? props.onProductClick(product) : navigate(`/products/${product.id}`)}
                                    className="product-info-link"
                                >
                                    <p className="product-info" style={{ whiteSpace: "pre" }}>
                                        {product.name} {'    '} ${product.price}
                                    </p>
                                </div>

                                {/* Buy buttons - preserve existing functionality */}
                                <div className="buy-buttons">
                                    <span>
                                        <button
                                            className="buy-button-new snipcart-add-item"
                                            data-item-id={product.id}
                                            data-item-price={product.price}
                                            data-item-description={product.description}
                                            data-item-url={product.url}
                                            data-item-name={product.name}
                                            data-item-custom1-name={product.custom1Name}
                                            data-item-custom1-options={product.custom1Options}
                                            data-item-custom2-name={product.custom2Name}
                                            data-item-custom2-options={product.custom2Options}
                                        >
                                            Add to cart
                                        </button>
                                        <p className="divider">|</p>
                                    </span>
                                    <span>
                                        <button className="btc-buy-button-new">
                                            <a className="buy-with-crypto" href={product.crypto}>₿</a>
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
} 