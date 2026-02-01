import React from "react";
import ErrorFace from "./components/ErrorFace";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("React crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFace />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
