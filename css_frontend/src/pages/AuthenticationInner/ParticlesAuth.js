import React, { useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import withRouter from '../../Components/Common/withRouter';

const particlesInit = async (engine) => {
    await loadSlim(engine);
};

const ParticlesAuth = ({ children }) => {

    const options = useMemo(() => ({
        background: { color: { value: "transparent" } },
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: { enable: false },
                onHover: { enable: false },
            },
        },
        particles: {
            color: { value: "#ffffff" },
            move: {
                direction: "bottom",
                enable: true,
                outModes: { default: "out" },
                random: true,
                speed: { min: 1, max: 3 },
                straight: false,
            },
            number: {
                density: { enable: true, area: 800 },
                value: 120,
            },
            opacity: {
                value: { min: 0.1, max: 0.5 },
                animation: {
                    enable: true,
                    speed: 0.5,
                    minimumValue: 0.05,
                },
            },
            shape: { type: "circle" },
            size: {
                value: { min: 1, max: 3 },
            },
        },
        detectRetina: true,
    }), []);

    return (
        <React.Fragment>
            <div className="auth-page-wrapper pt-5">
                <div className="auth-one-bg-position auth-one-bg" id="auth-particles">

                    <div className="bg-overlay"></div>

                    <div className="shape">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 1440 120">
                            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
                        </svg>
                    </div>

                    <ParticlesProvider init={particlesInit}>
                        <Particles
                            id="tsparticles"
                            options={options}
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                            }}
                        />
                    </ParticlesProvider>

                    {children}

                </div>

                <footer className="footer">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="text-center">
                                    <p className="mb-0 text-muted">&copy; {new Date().getFullYear()} CSS. Crafted with <i className="mdi mdi-heart text-danger"></i> by ASR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </React.Fragment>
    );
};

export default withRouter(ParticlesAuth);
