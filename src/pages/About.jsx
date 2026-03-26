import './About.css';

function About() {
  return (
    <div className="about">
      <h1>About Ruby</h1>
      <div className="about-content">
        <p>
          This portfolio showcases the achievements and awards earned throughout my academic
          and extracurricular journey. Each achievement represents a milestone in my personal
          and professional growth.
        </p>
        <p>
          I believe in continuous learning and challenging myself in various fields. This
          collection reflects my dedication to excellence in academics, sports, and the arts.
        </p>
        <h2>Categories</h2>
        <div className="category-list">
          <div className="category-item">
            <h3>Academic</h3>
            <p>Honors, awards, and recognition for academic excellence</p>
          </div>
          <div className="category-item">
            <h3>Sports</h3>
            <p>Athletic achievements and competitive sports awards</p>
          </div>
          <div className="category-item">
            <h3>Arts</h3>
            <p>Creative accomplishments in music, visual arts, and performance</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
