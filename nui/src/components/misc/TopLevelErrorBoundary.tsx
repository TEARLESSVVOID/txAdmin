import React, { Component } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { fetchNui } from "../../utils/fetchNui";

interface ErrorCompState {
  hasError: boolean;
  error: Error | null;
}

export class TopLevelErrorBoundary extends Component<any, ErrorCompState> {
  state = {
    hasError: false,
    error: null,
  };

  constructor(props) {
    super(props);
    this.handleReloadClick.bind(this);
  }

  componentDidUpdate() {
    if (this.state.hasError) fetchNui("focusInputs", true);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReloadClick() {
    fetchNui("focusInputs", false);
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Dialog open={this.state.hasError}>
          <DialogTitle>发生致命错误</DialogTitle>
          <DialogContent>
            <DialogContentText>
              txAdmin 菜单遇到了无法自动恢复的错误，需要重新加载 NUI 界面。以下错误信息仅供开发者参考。
              <br />
              <br />
              <code style={{ color: "red" }}>{this.state.error.message}</code>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={this.handleReloadClick}>
              重新加载菜单
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    return this.props.children;
  }
}
