from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register routes
    from .routes import main
    app.register_blueprint(main)
    
    return app