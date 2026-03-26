import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to Ruby's Achievement Portfolio</h1>
        <p>Celebrating success, one achievement at a time</p>
        <Link to="/achievements" className="cta-button">View Achievements</Link>
      </section>

      <section className="intro">
        <h2>About This Portfolio</h2>
        <p>
          This is a collection of achievements and awards across various categories including
          academics, sports, and arts. Each achievement represents dedication, hard work, and
          continuous growth.
        </p>
      </section>
    </div>
  );
}

export default Home;
