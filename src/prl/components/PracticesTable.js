import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
} from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
  container: {
    marginTop: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  subtitle: {
    marginBottom: theme.spacing(2),
    fontSize: "0.9rem",
    color: theme.palette.text.secondary,
  },
  table: {
    marginBottom: theme.spacing(2),
    backgroundColor: '#f0feefff',
  },
  headerCell: {
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: theme.palette.grey[100],
  },
  descriptionCell: {
    width: "50%",
  },
  optionCell: {
    textAlign: "center",
    cursor: "pointer",
    userSelect: "none",
    padding: theme.spacing(1),
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  selected: {
    color: theme.palette.primary.main,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  textAreaContainer: {
    marginTop: theme.spacing(2),
  },
});

function PracticesTable(props) {
  const {
    classes,
    title,
    subtitle,
    rows,
    options = ["Sim", "Não", "N/A"],
    onSelectionChange,
    selections = {},
    showOtherPractices = false,
    otherPracticesLabel = "Outras Práticas Positivas",
    otherPracticesPlaceholder = "Descreva outras práticas observadas...",
    otherPracticesValue = "",
    onOtherPracticesChange,
  } = props;

  const handleCellClick = (rowId, rowDescription, option) => {
    const newSelections = {
      ...selections,
      [rowId]: selections[rowId]?.confirmacao === option ? null : {
        descricao: rowDescription,
        confirmacao: option,
      },
    };
    onSelectionChange(newSelections);
  };

  return (
    <Box className={classes.container}>
      <Typography variant="h6" className={classes.title}>
        {title}
      </Typography>
      <Typography className={classes.subtitle}>
        {subtitle}
      </Typography>

      <TableContainer component={Paper} className={classes.table}>
        <Table >
          <TableHead>
            <TableRow>
              <TableCell className={`${classes.headerCell} ${classes.descriptionCell}`}>
                Descrição
              </TableCell>
              {options.map((option) => (
                <TableCell key={option} className={classes.headerCell}>
                  {option}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className={classes.descriptionCell}>
                  {row.description}
                </TableCell>
                {options.map((option) => (
                  <TableCell
                    key={`${row.id}-${option}`}
                    className={classes.optionCell}
                    onClick={() => handleCellClick(row.id, row.description, option)}
                  >
                    {selections[row.id]?.confirmacao === option && (
                      <span className={classes.selected}>●</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showOtherPractices && (
        <Box className={classes.textAreaContainer}>
          <TextField
            fullWidth
            label={otherPracticesLabel}
            placeholder={otherPracticesPlaceholder}
            value={otherPracticesValue}
            onChange={onOtherPracticesChange}
            variant="outlined"
            size="small"
            multiline
            rows={4}
          />
        </Box>
      )}
    </Box>
  );
}

export default withTheme(withStyles(styles)(PracticesTable));
