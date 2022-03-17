import React, { useCallback } from "react";
import { Row, Col, Button, ButtonGroup } from 'react-bootstrap';

import type { ImportIssue } from "../../common/import";
import { importsSlice, Statement as StatementType } from "../../features/imports/importsSlice";
import { useAppDispatch } from "../hooks";

interface StatementProps {
  statement: StatementType;
  idx: number;
  database: string;
  callbacks: {
    handleFixSequence: (statementIdx: number, issueIdentifier: string) => void;
    handleTextAreaChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleAddStatement: (idx: number) => void;
    setShowSQLExec: (showSQLExec: boolean, text?: string) => void;
    setActiveStatement: () => void;
    handleAddUser: (user: string) => void;
  }
}

export const Statement = React.forwardRef<HTMLTextAreaElement, StatementProps>((props, ref) => {
  const statement = props.statement;

  const colorForIssue = (issues: ImportIssue[]) => {
    if (issues == null || issues.length === 0) {
      return null;
    }
    var color = 'info';
    issues.forEach((value) => {
      switch (value.level) {
        case "info":
          break;
        default:
          color = 'danger';
      }
    });
    return color;
  }

  const dispatch = useAppDispatch();
  const onDelete = useCallback(() => {
    dispatch(importsSlice.actions.softDeleteStatements([ statement ]));
  }, [ dispatch, statement ]);

  const onFixSequence = (statementIdx: number, issueIdentifier: string) =>
    () => props.callbacks.handleFixSequence(statementIdx, issueIdentifier)

  const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
  const hyperlinkText = (inputText: string) =>
    inputText.split(" ")
      .map((part, idx) =>
        <React.Fragment key={idx}>
          {URL_REGEX.test(part) ? <>
            <a href={part} target="_blank" rel="noreferrer">{part}</a>&nbsp;
          </> : (part + " ")
          }
        </React.Fragment>
      );

  return (
    <Row className={"m-2 p-2 border " + (colorForIssue(statement.issues) != null ? 'border-' + colorForIssue(statement.issues) : '')}>
      <Col xs={6}>
        <pre>{statement.original}</pre>
      </Col>
      <Col xs={6}>

        <ul>
          {statement.issues != null && statement.issues.length > 0 ? statement.issues.map((issue, idx) => (
            <li key={'li' + idx} className={"issue-level-" + issue.level}>
              {hyperlinkText(issue.text)}
              {issue.type === 'unimplemented' ? (
                <Button variant="outline-danger" onClick={onDelete}>Delete Statement</Button>
              ) : ''}
              {issue.type === "sequence" ? (
                <Button variant="outline-info" onClick={onFixSequence(props.idx, issue.id)}>Make UUID</Button>
              ) : ''}
              {issue.type === "missing_user" ? (
                <Button variant="outline-info" onClick={() => props.callbacks.handleAddUser(issue.id)}>Add user "{issue.id}"</Button>
              ) : ''}
            </li>
          )) : ''}
        </ul>
        <textarea
          className="form-control"
          id={'ta' + props.idx}
          value={statement.deleted ? '' : statement.cockroach}
          ref={ref}
          placeholder={statement.deleted ? '-- statement ignored' : statement.cockroach}
          onChange={props.callbacks.handleTextAreaChange}
          onFocus={() => props.callbacks.setActiveStatement()}
          rows={statement.cockroach.split('\n').length + 1}
        />

        <p style={{ textAlign: 'center' }}>
          <ButtonGroup>
            <Button variant="outline-primary" onClick={() => props.callbacks.handleAddStatement(props.idx)}>Insert Before</Button>
            <Button variant="outline-primary" onClick={() => props.callbacks.handleAddStatement(props.idx + 1)}>Insert After</Button>
            <Button variant="outline-secondary" onClick={onDelete}>Delete</Button>
            <Button variant="outline-primary" onClick={() => props.callbacks.setShowSQLExec(true, statement.cockroach)} disabled={props.database === ""}>Execute</Button>
          </ButtonGroup>
        </p>
      </Col>
    </Row>
  )
});
