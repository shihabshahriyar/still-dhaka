import React from 'react';
import { Input, Header, Container, Button } from 'semantic-ui-react';
import Masonry from 'react-masonry-css';
import Photo from '../../components/photo/Photo';
import { db } from '../../config/firebaseConfig';
import { connect } from 'react-redux';
import { BeatLoader } from 'react-spinners';
import {
  isMobile
} from "react-device-detect";

class Landing extends React.Component {
    state = {
        photos: [],
        limit: 6,
        lastVisible: null,
        isScrollExecuted: false,
        maxReached: false
    }
    isBottom(el) {
        return el.getBoundingClientRect().bottom <= window.innerHeight;
    }
    retrieveData = async () => {
        try {
            let initialQuery = await db.collection('photos')
                .orderBy('id')
                .limit(this.state.limit)
            let documentSnapshots = await initialQuery.get();
            if (documentSnapshots.docs.length > 0) {
                let photos = documentSnapshots.docs.map(document => document.data());
                let lastVisible = photos[photos.length - 1].id;
                this.setState({
                    photos: photos,
                    lastVisible: lastVisible,
                });
            } else {
                this.setState({
                    maxReached: true
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    retrieveMore = async () => {
        try {
            let additionalQuery = await db.collection('photos')
                .orderBy('id')
                .startAfter(this.state.lastVisible)
                .limit(this.state.limit)
            let documentSnapshots = await additionalQuery.get();
            if (documentSnapshots.docs.length > 0) {
                let photos = documentSnapshots.docs.map(document => document.data());
                let lastVisible = photos[photos.length - 1].id;
                this.setState({
                    photos: [...this.state.photos, ...photos],
                    lastVisible: lastVisible
                });
            } else {
                this.setState({
                    maxReached: true
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    componentDidMount = () => {
        let imageContainer = document.getElementById('imageContainer');
        document.onscroll = () => {
            // Inside the "if" statement the "isExecuted" variable is negated to allow initial code execution.
            if (this.isBottom(imageContainer) && !this.state.isScrollExecuted) {
                // Set "isExecuted" to "true" to prevent further execution
                this.setState({ isScrollExecuted: true });

                // Your code goes here
                try {
                    this.retrieveMore();
                }
                catch (error) {
                    console.log('Maximum reached');
                }

                // After 1 second the "isExecuted" will be set to "false" to allow the code inside the "if" statement to be executed again
                setTimeout(() => {
                    this.setState({ isScrollExecuted: false });
                }, 1000);
            }
        }
        try {
            this.retrieveData();
        }
        catch (error) {
            console.log(error);
        }

    }
    componentDidUpdate = (prevProps) => {
        if (prevProps != this.props) {
            db.collection('photos')
                .orderBy('id')
                .endAt(this.state.lastVisible)
                .get()
                .then((documentSnapshots) => {
                    let photos = documentSnapshots.docs.map(document => document.data());
                    let lastVisible = photos[photos.length - 1].id;
                    this.setState({
                        photos: photos,
                        lastVisible: lastVisible
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
    render = () => (
        <div>
            <section className="hero-banner">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-text-header">Wherever you are, its Still Dhaka.</h1>
                    </div>
                    <div className="hero-input">
                        <Input icon='search' placeholder='Search for the best talent and photos in Dhaka.' fluid style={{ borderRadius: '0 !important' }} />
                    </div>
                </div>
            </section>
            <section>
                <Container>
                    <Masonry
                        id="imageContainer"
                        breakpointCols={isMobile == true ? 1 : 3}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column">
                        {this.state.photos &&
                            this.state.photos.map((photo, index) => {
                                return (
                                    <Photo photo={photo} key={index} />
                                )
                            })
                        }
                    </Masonry>
                    {this.state.isScrollExecuted && !this.state.maxReached && <div className="scroll-loader"><BeatLoader color="#4DAF7C" /></div>}
                    {this.state.maxReached && <h1 style={{ textAlign: 'center', marginBottom: 40 }}>No more images to load</h1>}
                </Container>
            </section>
        </div>
    )
};

const mapStateToProps = (state) => ({
    auth: state.auth
});

export default connect(mapStateToProps)(Landing);