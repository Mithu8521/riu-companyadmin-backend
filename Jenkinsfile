pipeline {
    agent any

    environment {
        DEPLOY_USER = "ubuntu"                        // Ubuntu user
        DEPLOY_HOST = "13.205.115.213"               // EC2 IP
        DEPLOY_PATH = "/var/www/html/riu-cbackend"   // Deployment path
        SUCCESS_MESSAGE = "✅ Deployment done"
    }

    triggers {
        // Poll SCM every 2 minutes to auto-detect commits
        pollSCM('H/2 * * * *')
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Checking out staging branch from GitHub..."
                git branch: 'staging',
                    url: 'git@github.com:Mithu8521/riu-companyadmin-backend.git',
                    credentialsId: 'ubuntu-ssh'
            }
        }

        stage('Deploy Code') {
            steps {
                echo "Deploying code to EC2 server..."
                sshagent(['ubuntu-ssh']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        # Create folder if not exists
                        mkdir -p ${DEPLOY_PATH}

                        # Remove old code
                        rm -rf ${DEPLOY_PATH}/*

                        # Copy new code
                        cp -r * ${DEPLOY_PATH}

                        # Navigate to project folder
                        cd ${DEPLOY_PATH}

                        # Install dependencies
                        npm i -f

                        # Run prebuild
                        npm run prebuild

                        # Run build for QA environment
                        npm run build:qa

                        # Restart PM2 process (assuming id 0)
                        pm2 restart 0
                    '
                    """
                }
            }
        }

        stage('Post Deployment') {
            steps {
                echo "${SUCCESS_MESSAGE}"
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful"
        }
        failure {
            echo "❌ Deployment Failed"
        }
    }
}
